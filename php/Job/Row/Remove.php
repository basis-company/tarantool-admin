<?php

namespace Job\Row;

use Job\Space\Job;
use Exception;
use stdClass;

class Remove extends Job
{
    public stdClass $id;

    public function run(): void
    {
        $params = get_object_vars($this->id);
        if (!count($params)) {
            throw new Exception("Invalid params");
        }

        foreach ($this->getSpaceInstances() as $space) {
            if ($space === null) {
                continue;
            }

            foreach ($space->find($params) as $row) {
                $space->delete($row);
            }
        }
    }
}
