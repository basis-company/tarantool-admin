<?php

include dirname(__DIR__) . '/vendor/autoload.php';

try {
    $app = new Basis\Application(dirname(__DIR__));
    $container = $app->getContainer();

    $container->share(
        Psr\Log\LoggerInterface::class,
        new Monolog\Logger('tarantool-admin')
    );

    $container->share(
        Symfony\Component\Cache\Adapter\AdapterInterface::class,
        Symfony\Component\Cache\Adapter\ArrayAdapter::class
    );

    echo $app->get(Basis\Http::class)
        ->process($_SERVER['REQUEST_URI']);
} catch (Exception $e) {
    echo $e->getMessage();
}
