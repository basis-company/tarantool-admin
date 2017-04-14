<?php

include 'vendor/autoload.php';

use Basis\Application;
use Basis\Http;

$app = new Application(__DIR__);
try {
	echo $app->get(Http::class)->process($_SERVER['REQUEST_URI']);
} catch(Exception $e) {
	echo 'Not found';
}