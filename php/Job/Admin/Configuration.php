<?php

namespace Job\Admin;

class Configuration
{
    public function run()
    {
        return [
            'readOnly' => getenv('TARANTOOL_CONNECTIONS_READONLY') ? true : false,
            'connections' => explode(',', getenv('TARANTOOL_CONNECTIONS'))
        ];
    }
}
