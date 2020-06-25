<?php

include 'vendor/autoload.php';

use Basis\Application;
use Basis\Http;

date_default_timezone_set('Europe/Moscow');

try {
    $app = new Application(__DIR__);
    echo $app->get(Http::class)->process($_SERVER['REQUEST_URI']);
} catch (Exception $e) {
    echo $e->getMessage();
}
