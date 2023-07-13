<?php

namespace App\Library;

use GuzzleHttp\Client;
use Exception;
use RuntimeException;
use GuzzleHttp\Exception\RequestException;

class Bandaid
{
  public function __construct()
  {
    if (!config('bandaid.key')) {
      throw new \Exception('A CDL Token must be Specified');
    }

    $this->client = new Client([
      'headers' => [
        'Authorization' => 'Bearer ' . config('bandaid.key'),
      ],
      'base_uri' => 'https://cla-bandaid-prd-web.oit.umn.edu/api/',
    ]);
  }

  public function getDepartments(array $deptIds): array
  {
    try {
      $result = $this->client->get('department/?' . urldecode(http_build_query(["deptId"=>$deptIds])));
      return json_decode($result->getBody());
    } catch (RequestException $e) {
      $msg = $e->getMessage();
      $errorMessage = 'getUserName Error: ' . $msg;
      throw new RuntimeException($errorMessage);
    }
  }
}
