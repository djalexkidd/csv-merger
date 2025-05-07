# csv-merger

Un utilitaire web pour fusionner deux fichiers CSV.

[Lien de l'application](https://djalexkidd.github.io/csv-merger)

## Installation

### Docker Compose

Voici un exemple de fichier Compose pour déployer l'application :

```yaml
services:
  csv-merger:
    image: ghcr.io/djalexkidd/csv-merger:latest
    container_name: csv-merger
    restart: always
    ports:
      - "80:8080"
```

Pour avoir un exemple avec Traefik : [docker-compose.yaml avec Traefik](https://github.com/djalexkidd/csv-merger/blob/master/docker-compose.yaml)