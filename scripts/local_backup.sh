#!/bin/bash
# Script de backup para SQLite - Sorbito de Fé

BACKUP_DIR="/home/dany/DV/Code Proyectos/sorbito-de-fe/backups_locales"
DB_PATH="/home/dany/DV/Code Proyectos/sorbito-de-fe/database/sorbito.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/sorbito_backup_${TIMESTAMP}.tar.gz"

mkdir -p "$BACKUP_DIR"

if [ -f "$DB_PATH" ]; then
    # Copia segura para evitar bloqueo de la DB
    cp "$DB_PATH" "$BACKUP_DIR/temp.db"
    tar -czf "$BACKUP_FILE" -C "$BACKUP_DIR" temp.db
    rm "$BACKUP_DIR/temp.db"
    
    echo "Backup creado exitosamente: $BACKUP_FILE"
    
    # Mantener solo los últimos 30 backups
    ls -t "$BACKUP_DIR"/sorbito_backup_*.tar.gz | tail -n +31 | xargs -r rm --
else
    echo "Error: Base de datos no encontrada en $DB_PATH"
    exit 1
fi
