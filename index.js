const today = new Date();

document.getElementById('mergeBtn').addEventListener('click', () => {
    const file1 = document.getElementById('fileInput1').files[0];
    const file2 = document.getElementById('fileInput2').files[0];
  
    if (!file1 || !file2) {
      alert("Veuillez sélectionner les deux fichiers CSV.");
      return;
    }
  
    Promise.all([parseCSV(file1), parseCSV(file2)]).then(([data1, data2]) => {
      const headers1 = data1[0];

      console.log(data1[0]);
      console.log(data2[0]);
  
      const merged = [headers1, ...data1.slice(1), ...data2];
      const csv = Papa.unparse(merged);
  
      downloadCSV(csv, `document_${today.toISOString().split('T')[0]}.csv`);
    });
  });
  
  function parseCSV(file) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        complete: (results) => resolve(results.data),
        error: (err) => reject(err),
        skipEmptyLines: true
      });
    });
  }
  
  function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }