<?php

namespace Job\Admin;

class Configuration
{
    public function run()
    {
        return [
            'readOnly' => getenv('TARANTOOL_CONNECTIONS_READONLY') ? true : false,
            'connections' => explode(',', getenv('TARANTOOL_CONNECTIONS')),
            'query' => getenv('TARANTOOL_DATABASE_QUERY') ? true : false,
        ];
    }
}
