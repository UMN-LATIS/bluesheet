<?php

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Http;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "uses()" function to bind a different classes or traits.
|
*/

uses(
    Tests\TestCase::class,
    Illuminate\Foundation\Testing\RefreshDatabase::class,
)->in('Feature');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function fixture(string $filename): array {
    $cwd = getcwd();
    $path = $cwd . "/tests/Fixtures/$filename";

    if (!file_exists($path)) {
        throw new InvalidArgumentException(
            "File at path [$path] does not exist."
        );
    }

    $file = file_get_contents(
        filename: $path,
    );

    if (!$file) {
        throw new InvalidArgumentException(
            message: "Cannot find fixture: [$filename] at tests/Fixtures/$filename",
        );
    }

    return json_decode(
        json: $file,
        associative: true,
    );
}

function mockResponse(string $filename, int $status = 200) {
    $fixture = fixture($filename);
    return Http::response($fixture, $status);
}

function setupMockBandaidApiResponses() {
    $BANDAID_API = config('bandaid.baseUri');

    $fakedResponses = [
        "{$BANDAID_API}/classes/terms*" => mockResponse("Bandaid/mockGetTerms.json"),
        "{$BANDAID_API}/classes/list*" => mockResponse("Bandaid/mockGetDeptClassList.json"),
        "{$BANDAID_API}/department/*/employees" => mockResponse("Bandaid/mockGetEmployeesForDept.json"),
    ];

    Http::fake($fakedResponses);
}

function promoteUserToGroupManager(int $userId, int $groupId): void {
    $membership = App\Membership::where('user_id', $userId)
        ->where('group_id', $groupId)
        ->first();
    $membership->admin = true;
    $membership->save();
}
