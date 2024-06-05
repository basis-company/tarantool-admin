<?php

namespace Job\Database;

use Exception;
use Job\Database\Info as DatabaseInfo;
use Job\Database\Spaces as SpaceList;
use Job\Space\Info as SpaceInfo;
use Job\Space\Select as Select;
use Tarantool\Client\Client;
use Tarantool\Client\Middleware\AuthenticationMiddleware;
use Tarantool\Mapper\Mapper;

abstract class Job
{
    public ?string $socket = null;
    public ?string $hostname = null;
    public string|int|null $port = null;
    public ?string $username = null;
    public ?string $password = null;
    public string $code;
    public array $key;
    public int $iterator;

    private Client $client;
    private Mapper $mapper;

    public function getClient(): Client
    {
        if (getenv('TARANTOOL_READONLY') === 'true' || getenv('TARANTOOL_READONLY') === '1') {
            $changes = !in_array(get_class($this), [Info::class, Select::class, SpaceInfo::class, Spaces::class]);
            if (get_class($this) == Execute::class) {
                $changes = false;
                $stoplist = 'drop truncate create format insert update';
                foreach (explode(' ', $stoplist) as $candidate) {
                    if (strpos(strtolower($this->code), $candidate) !== false) {
                        $changes = true;
                    }
                }
            }
            if ($changes) {
                throw new Exception("Tarantool admin is in readonly mode");
            }
        }

        if (!isset($this->client)) {
            if (!$this->hostname || !$this->port) {
                if (!$this->socket) {
                    throw new Exception('Invalid connection parameters');
                }
            }

            $dsn = $this->socket ?: 'tcp://' . $this->hostname . ':' . $this->port;
            $this->client = Client::fromDsn($dsn)->withMiddleware(
                new AuthenticationMiddleware($this->username ?: 'guest', $this->password),
            );
        }

        return $this->client;
    }

    public function getMapper(): Mapper
    {
        if (!isset($this->mapper)) {
            $this->mapper = new Mapper($this->getClient(), arrays: true);
        }

        return $this->mapper;
    }
}
