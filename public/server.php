<?php

include dirname(__DIR__) . '/vendor/autoload.php';

try {
    $json = $_POST['rpc'];
    $parsed = json_decode($json, true);
    $parts = explode('.', 'job.'.$parsed['job']);
    $uppercased = array_map('ucfirst', $parts);
    $class = implode('\\', $uppercased);
    $instance = new $class;

    foreach ($parsed['params'] as $k => $v) {
      $instance->$k = $v;
    }

    $result = $instance->run();
    echo json_encode(['success' => true, 'data' => $result]);
} catch (Exception $e) {
    echo $e->getMessage();
}
