<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('rendezvous', function (Blueprint $table) {
            $table->enum('type_consultation', [
                'premiere_consultation',
                'controle',
                'suivi',
                'urgence',
            ])->default('premiere_consultation')->after('statut');

            $table->text('motif')->nullable()->after('type_consultation');           // Motif principal de la visite
            $table->text('symptomes')->nullable()->after('motif');                   // Description des symptômes
            $table->boolean('ordonnance_precedente')->default(false)->after('symptomes'); // A-t-il une ancienne ordonnance ?
            $table->text('medicaments_actuels')->nullable()->after('ordonnance_precedente'); // Médicaments en cours
            $table->text('allergies')->nullable()->after('medicaments_actuels');     // Allergies connues
            $table->text('notes_patient')->nullable()->after('allergies');           // Notes libres du patient
            $table->text('notes_medecin')->nullable()->after('notes_patient');       // Notes du médecin (remplies après consultation)
        });
    }

    public function down(): void
    {
        Schema::table('rendezvous', function (Blueprint $table) {
            $table->dropColumn([
                'type_consultation',
                'motif',
                'symptomes',
                'ordonnance_precedente',
                'medicaments_actuels',
                'allergies',
                'notes_patient',
                'notes_medecin',
            ]);
        });
    }
};
