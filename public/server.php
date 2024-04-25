<?php

include dirname(__DIR__) . '/vendor/autoload.php';

try {
    ini_set('display_errors', 'on');
    error_reporting(E_ALL);
    if (!array_key_exists('rpc', $_POST)) {
        throw new Exception("No rpc defined");
    }
    $json = $_POST['rpc'];
    $parsed = json_decode($json);
    if (!$parsed) {
        throw new Exception("Invalid rpc format");
    }

    if (!$parsed->job || !$parsed->params) {
        throw new Exception("Invalid rpc format");
    }
    $parts = explode('.', 'job.'.$parsed->job);
    $uppercased = array_map('ucfirst', $parts);
    $class = implode('\\', $uppercased);

    if (!class_exists($class)) {
        throw new Exception("Invalid rpc.job value");
    }

    $instance = new $class;

    foreach ($parsed->params as $k => $v) {
      $instance->$k = $v;
    }

    $result = $instance->run();
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'data' => $result]);
} catch (Exception $e) {
    echo $e->getMessage();
}
