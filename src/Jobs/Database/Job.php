<?php

namespace Jobs\Database;

use Exception;
use Tarantool\Mapper\Client;
use Tarantool\Mapper\Mapper;
use Tarantool\Client\Connection\StreamConnection;
use Tarantool\Client\Packer\PurePacker;

abstract class Job
{
    public $hostname;
    public $port;

    private $_client;
    private $_mapper;

    public function getClient()
    {
        if(!$this->_client) {
            if(!$this->hostname || !$this->port) {
                throw new Exception("Invalid params");
            }

            $connection = new StreamConnection('tcp://'.$this->hostname.':'.$this->port, [
                'socket_timeout' => 30,
                'connect_timeout' => 30
            ]);

            $this->_client = new Client($connection, new PurePacker());
        }

        return $this->_client;
    }

    public function getMapper()
    {
        if(!$this->_mapper) {
            $this->_mapper = new Mapper($this->getClient());
        }

        return $this->_mapper;
    }
}