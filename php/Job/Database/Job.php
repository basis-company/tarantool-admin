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
    /**
     * Connection targets. A single host and a cluster are the same thing here:
     * an array with one or many entries. Every entry is `host[:port]`,
     * an explicit DSN (`tcp://host:port`, `unix:///path/to/socket`) or a
     * legacy unix socket path (a local file).
     */
    public array $hosts = [];

    // deprecated single host parameters, normalized into $hosts
    public ?string $socket = null;
    public ?string $hostname = null;
    public string|int|null $port = null;
    public ?string $username = null;
    public ?string $password = null;
    public string $code;
    public array $key;
    public int $iterator;

    private ?Client $client = null;
    private ?Mapper $mapper = null;
    private ?array $mappers = null;

    public function isCluster(): bool
    {
        return count($this->getDsnList()) > 1;
    }

    public function getDsnList(): array
    {
        if ($this->mappers === null) {
            $hosts = $this->hosts;

            // legacy api: hostname/port/socket as a single implicit host
            if (!count(array_filter($hosts, fn ($host) => trim((string) $host) !== ''))) {
                if ($this->socket) {
                    $hosts = [$this->socket];
                } elseif ($this->hostname) {
                    $hosts = [$this->hostname . ':' . ($this->port ?: 3301)];
                }
            }

            $dsn = [];

            foreach ($hosts as $candidate) {
                if (is_array($candidate)) {
                    $candidate = reset($candidate) ?: '';
                }

                $candidate = trim((string) $candidate);

                if ($candidate === '') {
                    continue;
                }

                if (
                    !str_contains($candidate, '://') &&
                    !str_starts_with($candidate, '/') &&
                    !file_exists($candidate)
                ) {
                    if (!str_contains($candidate, ':')) {
                        $candidate .= ':3301';
                    }

                    $candidate = 'tcp://' . $candidate;
                }

                $dsn[$candidate] = $candidate;
            }

            if (!count($dsn)) {
                throw new Exception('Invalid connection parameters');
            }

            $this->mappers = [];

            foreach ($dsn as $uri) {
                $this->mappers[$uri] = new Mapper(
                    $this->clientFromDsn($uri),
                    arrays: true,
                );
            }
        }

        return array_keys($this->mappers);
    }

    public function getMappers(): array
    {
        $this->getDsnList();

        return $this->mappers;
    }

    protected function clientFromDsn(string $dsn): Client
    {
        if (str_starts_with($dsn, '/')) {
            $dsn = 'unix://' . $dsn;
        }

        return Client::fromDsn($dsn)->withMiddleware(
            new AuthenticationMiddleware($this->username ?: 'guest', $this->password ?? '')
        );
    }

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

        if ($this->client === null) {
            $mappers = $this->getMappers();
            $this->client = reset($mappers)->client;
        }

        return $this->client;
    }

    public function getMapper(): Mapper
    {
        if ($this->mapper === null) {
            $this->mapper = new Mapper($this->getClient(), arrays: true);
        }

        return $this->mapper;
    }
}
