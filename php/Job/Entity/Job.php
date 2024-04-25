<?php

namespace Job\Entity;

use Job\Space\Job as SpaceJob;

class Job extends SpaceJob
{
    public function toArray($data): array
    {
        if (!$data) {
            return [];
        }
        if (is_object($data)) {
            $data = get_object_vars($data);
        }
        foreach ($data as $k => $v) {
            if (is_array($v) || is_object($v)) {
                $data[$k] = $this->toArray($v);
            }
        }
        return $data;
    }
}
