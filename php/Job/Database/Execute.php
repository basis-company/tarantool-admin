<?php

namespace Job\Database;

use Exception;

class Execute extends Job
{
    public $code;

    public function run()
    {
        if (!getenv('TARANTOOL_DATABASE_QUERY')) {
            throw new Exception("Error Processing Request");
        }

        $this->getMapper()->getClient()->setLogging(true);
        $result =$this->getMapper()->getClient()->evaluate($this->code)->getData();
        $event = array_reverse($this->getMapper()->getClient()->getLog())[0];

        return [
            'result' => $result,
            'timing' => $event[0]*1000,
        ];
    }
}
