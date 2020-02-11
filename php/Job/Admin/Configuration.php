<?php

namespace Job\Admin;

class Configuration
{
    public $repository = 'basis-company/tarantool-admin';

    // once per hour
    public $ttl = 3600;

    public function run()
    {
        return [
            'readOnly' => getenv('TARANTOOL_CONNECTIONS_READONLY') ? true : false,
            'connections' => explode(',', getenv('TARANTOOL_CONNECTIONS')),
            'query' => getenv('TARANTOOL_DATABASE_QUERY') ? true : false,
            'version' => @include('version.php') ?: [],
            'latest' => $this->getLatest(),
        ];
    }

    protected function getLatest()
    {
        if (file_exists('latest.php')) {
            $latest = include('latest.php');
            if ($latest['tag'] && $latest['timestamp'] + $this->ttl >= time()) {
                return $latest['tag'];
            }
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => [
                    'User-Agent: PHP'
                ]
            ]
        ]);
        $url = "https://api.github.com/repos/$this->repository/releases/latest";
        $tag = @json_decode(file_get_contents($url, false, $context))->tag_name;
        $timestamp = time();

        file_put_contents('latest.php', '<?php return '.var_export(compact('tag', 'timestamp'), true) .';');
        return $tag;
    }
}
