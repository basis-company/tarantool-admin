<?php

namespace Job\Admin;

class Connections
{
    public function run()
    {
        return [
            'connections' => explode(',', getenv('TARANTOOL_CONNECTIONS'))
        ];
    }
}
