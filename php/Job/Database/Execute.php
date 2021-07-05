<?php

namespace Job\Database;

use Exception;

class Execute extends Job
{
    public string $code;

    public function run(): array
    {
        if (!getenv('TARANTOOL_DATABASE_QUERY')) {
            throw new Exception('Code execution is forbidden');
        }

        $start = microtime(true);
        $result = $this->getMapper()->getClient()->evaluate($this->code);

        foreach ($result as $k => $v) {
            if (!is_array($v)) {
                $result[$k] = ['scalar' => $v];
            }
        }

        return [
            'result' => $result,
            'timing' => 1000 * (microtime(true) - $start),
        ];
    }
}
