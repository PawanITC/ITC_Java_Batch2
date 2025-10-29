package com.learning.tribetalk.util;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class H2BackupManager {

    private static final String BACKUP_FILE = "./data/h2_backup.sql";

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Restore DB state from backup file if exists.
     */
    @PostConstruct
    public void restoreDatabase() {
        try {
            jdbcTemplate.execute("RUNSCRIPT FROM '" + BACKUP_FILE + "'");
            System.out.println("✅ H2 database restored from backup: " + BACKUP_FILE);
        } catch (Exception e) {
            System.out.println("⚠️ No existing backup found or restore failed: " + e.getMessage());
        }
    }

    /**
     * Backup DB state to file before shutdown.
     */
    @PreDestroy
    public void backupDatabase() {
        try {
            jdbcTemplate.execute("SCRIPT TO '" + BACKUP_FILE + "'");
            System.out.println("💾 H2 database backed up to: " + BACKUP_FILE);
        } catch (Exception e) {
            System.out.println("⚠️ Backup failed: " + e.getMessage());
        }
    }
}