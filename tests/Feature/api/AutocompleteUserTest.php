<?php

use App\User;
use Illuminate\Support\Facades\Http;

use function Pest\Laravel\{getJson, actingAs};

beforeEach(function () {
    setupMockBandaidApiResponses();
    $this->user = User::factory()->create();
});

it('returns matching people from Bandaid for the autocomplete endpoint', function () {
    actingAs($this->user)
        ->getJson('/api/autocompleter/user?searchType=nameAndInternetId&q=smith')
        ->assertOk()
        ->assertJson([
            'items' => [
                [
                    'full_name' => 'John Smith',
                    'mail' => 'smit1234@umn.edu',
                    'uid' => 'smit1234',
                    'umndid' => '36ygntqhe',
                ],
            ],
        ]);
});

it('sorts an exact internet id match to the front of the results', function () {
    $BANDAID_API = config('bandaid.baseUri');
    clearExistingHttpFakes();
    Http::fake(getMockBandaidResponses([
        "{$BANDAID_API}/names/autocomplete/*" => Http::response([
            [
                'id' => 300900,
                'EMPLID' => 200,
                'NAME' => 'Smithson,Jane',
                'MIDDLE_NAME' => '',
                'LAST_NAME' => 'Smithson',
                'FIRST_NAME' => 'Jane',
                'FULL_NAME' => 'Jane Smithson',
                'INTERNET_ID' => 'smit9999',
                'UMNDID' => 'abc12345',
            ],
            [
                'id' => 300815,
                'EMPLID' => 145,
                'NAME' => 'Smith,John',
                'MIDDLE_NAME' => '',
                'LAST_NAME' => 'Smith',
                'FIRST_NAME' => 'John',
                'FULL_NAME' => 'John Smith',
                'INTERNET_ID' => 'smit1234',
                'UMNDID' => '36ygntqhe',
            ],
        ]),
    ]));

    actingAs($this->user)
        ->getJson('/api/autocompleter/user?searchType=internetId&q=smit1234')
        ->assertOk()
        ->assertJsonPath('items.0.uid', 'smit1234')
        ->assertJsonPath('items.1.uid', 'smit9999');
});

