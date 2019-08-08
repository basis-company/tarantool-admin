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

        $start = microtime(true);
        $result = $this->getMapper()->getClient()->evaluate($this->code);

        foreach ($result as $k => $v) {
            if (!is_array($v)) {
                $result[$k] = [
                    'scalar' => $v
                ];
            }
        }

        return [
            'result' => $result,
            'timing' => microtime(true) - $start,
        ];
    }
}
