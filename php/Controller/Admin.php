<?php

namespace Controller;

use Basis\Toolkit;
use Exception;

class Admin
{
    use Toolkit;

    public function index(): void
    {
        include 'index.php';
    }

    public function api(): array
    {
        header('Content-Type: application/json');
        ini_set('display_errors', 'on');
        error_reporting(E_ALL);

        try {
            if (!array_key_exists('rpc', $_REQUEST)) {
                throw new Exception("No rpc defined");
            }
            $data = json_decode($_REQUEST['rpc']);
            if (!$data) {
                throw new Exception("Invalid rpc format");
            }

            if (!$data->job || !$data->params) {
                throw new Exception("Invalid rpc format");
            }

            return [
                'success' => true,
                'data' => $this->dispatch(strtolower($data->job), get_object_vars($data->params)),
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'trace' => explode(PHP_EOL, $e->getTraceAsString()),
            ];
        }
    }
}
