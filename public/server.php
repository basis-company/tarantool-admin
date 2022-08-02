<?php

include dirname(__DIR__) . '/vendor/autoload.php';

try {
    $app = new Basis\Application(dirname(__DIR__));

    $logger = new Monolog\Logger('tarantool-admin');

    $app->getContainer()
        ->share(Psr\Log\LoggerInterface::class, $logger);

    echo $app->get(Basis\Http::class)
        ->process($_SERVER['REQUEST_URI']);
} catch (Exception $e) {
    echo $e->getMessage();
}
