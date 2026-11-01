<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Disponibilite extends Model
{
    protected $fillable = [
        'medecin_id',
        'jour_semaine',
        'heure_debut',
        'heure_fin',
        'max_patients_par_heure',
    ];

    // Jours en français pour affichage
    public static array $jours = [
        0 => 'Lundi',
        1 => 'Mardi',
        2 => 'Mercredi',
        3 => 'Jeudi',
        4 => 'Vendredi',
        5 => 'Samedi',
        6 => 'Dimanche',
    ];

    public function medecin()
    {
        return $this->belongsTo(Medecin::class);
    }
}
