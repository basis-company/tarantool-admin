<?php

use Basis\Application;
use Basis\Http;

include dirname(__DIR__) . '/vendor/autoload.php';

try {
    $app = new Application(dirname(__DIR__));
    echo $app->get(Http::class)->process($_SERVER['REQUEST_URI']);
} catch (Exception $e) {
    echo $e->getMessage();
}
