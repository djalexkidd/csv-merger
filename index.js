const today = new Date();

document.getElementById('mergeBtn').addEventListener('click', () => {
  const file1 = document.getElementById('fileInput1').files[0];
  const file2 = document.getElementById('fileInput2').files[0];

  if (!file1 || !file2) {
    alert('Veuillez sélectionner les deux fichiers CSV.');
    return;
  }

  Promise.all([parseCSV(file1), parseCSV(file2)]).then(([glpiData, vmsData]) => {
    // 2 - Tri par nom (on suppose que le champ 'Nom' existe)
    const glpi = sortByName(glpiData);
    const vms = sortByName(vmsData);

    // 3 - Supprimer lignes "Inactif" dans colonne 'Statut'
    const glpiFiltered = glpi.filter(row => !['Inactif', 'Supprimé'].includes(row['Statut']));

    // 4 - Supprimer lignes "Hors tension" dans colonne 'État'
    const vmsFiltered = vms.filter(row => row['État'] !== 'Hors tension');

    // 5 - Vérifier le nombre de lignes
    console.log('GLPI lignes :', glpiFiltered.length);
    console.log('VMS lignes :', vmsFiltered.length);

    // 6 - Ajouter "unicancer-tiers2c" s'il n'existe pas
    if (!vmsFiltered.find(row => row['Nom'] === 'unicancer-tiers2c')) {
      vmsFiltered.push({
        Nom: 'unicancer-tiers2c',
        'Espace utilisé': '',
        "Mémoire de l'hôte": '',
        CPU: '',
        État: 'Sous tension'
      });
    }

    // 7 - Copier les colonnes depuis vms vers glpi
    const vmsMap = Object.fromEntries(vmsFiltered.map(row => [row['Nom'], row]));
    const merged = glpiFiltered.map(row => {
      const vm = vmsMap[row['Nom']];
      return {
        ...row,
        'État': vm?.['État'] || '',
        'Espace utilisé': vm?.['Espace utilisé'] || '',
        "Mémoire de l'hôte": vm?.["Mémoire de l'hôte"] || '',
        CPU: vm?.CPU || ''
      };
    });

    // 8 - Supprimer "GRP_" dans les Groupe responsable
    merged.forEach(row => {
      if (row['Groupe responsable']) row['Groupe responsable'] = row['Groupe responsable'].replace(/^GRP_/, '');
    });

    // 9 - Convertir To en GO (x1000) dans toutes les colonnes concernées
    ['Espace utilisé', "Mémoire de l'hôte"].forEach(col => {
      merged.forEach(row => {
        const match = row[col]?.match(/([\d,\.]+)\s*To/i);
        if (match) {
          // Remplacer virgule par point si nécessaire
          const value = parseFloat(match[1].replace(',', '.'));
          const go = (value * 1000).toFixed(2); // arrondi à 2 décimales
          row[col] = `${go} Go`;
        }
      });
    });

    // 10 à 12 - Remplacements dans "Groupe responsable"
    merged.forEach(row => {
      const grp = row['Groupe responsable'];
      if (['INFRA', 'SEC'].includes(grp)) {
        row['Groupe responsable'] = 'ALL';
      } else if (['BDD', 'DATAS', 'VSI'].includes(grp)) {
        row['Groupe responsable'] = 'ALL_DDP';
      }
    });

    // Supprimer la colonne vide
    merged.forEach(row => {
      delete row[''];
    });

    // Générer et télécharger le CSV fusionné
    const csv = Papa.unparse(merged);
    downloadCSV(csv, `fusion_${today.toISOString().split('T')[0]}.csv`);
  });
});

function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: results => resolve(results.data),
      error: reject
    });
  });
}

function sortByName(data) {
  return data.sort((a, b) => (a.Nom || '').localeCompare(b.Nom || ''));
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}