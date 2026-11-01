<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('disponibilites', function (Blueprint $table) {
            $table->dropColumn(['date_heure_debut', 'date_heure_fin']);
            // 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
            $table->tinyInteger('jour_semaine')->unsigned()->after('medecin_id')->comment('0=Lun,1=Mar,2=Mer,3=Jeu,4=Ven,5=Sam,6=Dim');
            $table->time('heure_debut')->after('jour_semaine');
            $table->time('heure_fin')->after('heure_debut');
            $table->unsignedSmallInteger('max_patients_par_heure')->default(4)->after('heure_fin');
        });
    }

    public function down(): void
    {
        Schema::table('disponibilites', function (Blueprint $table) {
            $table->dropColumn(['jour_semaine', 'heure_debut', 'heure_fin', 'max_patients_par_heure']);
            $table->dateTime('date_heure_debut')->after('medecin_id');
            $table->dateTime('date_heure_fin')->after('date_heure_debut');
        });
    }
};
