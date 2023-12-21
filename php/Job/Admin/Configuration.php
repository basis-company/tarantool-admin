<?php

namespace Job\Admin;

class Configuration
{
    public string $repository = 'basis-company/tarantool-admin';

    // once per hour
    public int $ttl = 3600;

    public function run(): array
    {
        $version = (@include dirname(__DIR__, 3) . '/var/version.php') ?: [];
        $latest = '';

        if (array_key_exists('tag', $version)) {
            $latest = $version['tag'];
        }

        if (getenv('TARANTOOL_CHECK_VERSION') !== 'false') {
            $latest = $this->getLatest();
        }

        return [
            'connectionsReadOnly' => (bool) getenv('TARANTOOL_CONNECTIONS_READONLY'),
            'connections' => explode(',', getenv('TARANTOOL_CONNECTIONS')),
            'query' => (bool) getenv('TARANTOOL_DATABASE_QUERY'),
            'readOnly' => getenv('TARANTOOL_READONLY') == 'true' || getenv('TARANTOOL_READONLY') == '1',
            'version' => $version,
            'latest' => $latest,
        ];
    }

    protected function getLatest()
    {
        $filename = dirname(__DIR__, 3) . '/var/latest.php';

        if (file_exists($filename)) {
            $latest = include $filename;
            if ($latest['tag'] && $latest['timestamp'] + $this->ttl >= time()) {
                return $latest['tag'];
            }
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => [
                    'User-Agent: PHP',
                ]
            ]
        ]);

        $url = "https://api.github.com/repos/$this->repository/releases/latest";
        $tag = @json_decode(file_get_contents($url, false, $context))->tag_name;
        $timestamp = time();

        file_put_contents($filename, '<' . '?php return ' . var_export(compact('tag', 'timestamp'), true) . ';');

        return $tag;
    }
}
