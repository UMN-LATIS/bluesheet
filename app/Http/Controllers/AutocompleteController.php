<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Library\Bandaid;

class AutocompleteController extends Controller
{
    public function userAutocompleter(Request $req) {
        $searchValue = $req->input('q');

        $bandaid = new Bandaid();

        // searchNames() matches on name or internet id, exact or fuzzy,
        // so a single call covers every searchType this endpoint used to support
        $returnArray = $bandaid->searchNames($searchValue)
            ->map(function ($person) {
                return [
                    'full_name' => $person->FULL_NAME,
                    'mail' => $person->INTERNET_ID . '@umn.edu',
                    'uid' => $person->INTERNET_ID,
                    // UMNDID is null for people without an active UMN internet account
                    'umndid' => $person->UMNDID ?: $person->INTERNET_ID,
                ];
            })
            ->unique('umndid')
            // exact matches on internet id or full name should surface first
            ->sortByDesc(fn ($person) => $this->isExactMatch($person, $searchValue))
            ->values();

        return response()->json(["items" => $returnArray]);
    }

    private function isExactMatch(array $person, string $searchValue): bool {
        $searchValue = strtolower(trim($searchValue));
        return strtolower($person['uid']) === $searchValue
            || strtolower($person['full_name']) === $searchValue;
    }

}
