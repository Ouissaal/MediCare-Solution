<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE rendezvous MODIFY COLUMN statut ENUM('EN_ATTENTE','CONFIRME','TERMINE','ANNULE') NOT NULL DEFAULT 'EN_ATTENTE'");
    }

    public function down(): void
    {
        // First move any TERMINE records to CONFIRME to avoid constraint error
        DB::statement("UPDATE rendezvous SET statut = 'CONFIRME' WHERE statut = 'TERMINE'");
        DB::statement("ALTER TABLE rendezvous MODIFY COLUMN statut ENUM('EN_ATTENTE','CONFIRME','ANNULE') NOT NULL DEFAULT 'EN_ATTENTE'");
    }
};
