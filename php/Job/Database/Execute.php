<?php

namespace Job\Database;

use Exception;

class Execute extends Job
{
    public $code;

    public function run()
    {
        return [
            'result' => $this->getMapper()->getClient()->evaluate($this->code)->getData()
        ];
    }
}
