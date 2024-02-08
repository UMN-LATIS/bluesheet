<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable;

/**
 * @mixin IdeHelperGroupArtifact
 */
class GroupArtifact extends Model implements Auditable
{

	use \OwenIt\Auditing\Auditable;
	
	public $fillable = ['label', 'target'];
	public $timestamps = true;

    public function group() {
        return $this->belongsTo("App\Group");
    }

}
