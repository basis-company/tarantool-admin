<?php

namespace Job\Database;

use Exception;

class Execute extends Job
{
    public function run(): array
    {
        if (!getenv('TARANTOOL_DATABASE_QUERY')) {
            throw new Exception('Code execution is forbidden');
        }

        $this->getClient();

        if ($this->isCluster()) {
            return $this->runCluster();
        }

        $start = microtime(true);
        $result = $this->getMapper()->client->evaluate($this->code);

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

    /**
     * Evaluates the code on every host and concatenates the returned
     * values: `return box.count()` on a cluster yields the count of
     * each instance.
     */
    protected function runCluster(): array
    {
        $result = [];
        $timing = 0;

        foreach ($this->getMappers() as $dsn => $mapper) {
            $start = microtime(true);
            $returned = $mapper->client->evaluate($this->code);
            $timing += 1000 * (microtime(true) - $start);

            foreach ($returned as $k => $v) {
                if (!is_array($v)) {
                    $v = ['scalar' => $v];
                }

                $result[$k] = array_merge($result[$k] ?? [], $v);
            }
        }

        ksort($result);

        return [
            'result' => array_values($result),
            'timing' => $timing,
        ];
    }
}
