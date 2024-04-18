<?php

namespace Job\Entity;

use Job\Space\Job;

class Converter extends Job
{
    public function toArray($data, $dropApplication = false): array
        {
            if (!$data) {
                return [];
            }

            if (is_object($data)) {
                $data = get_object_vars($data);
                if ($dropApplication && array_key_exists('app', $data)) {
                    unset($data['app']);
                }
            }

            foreach ($data as $k => $v) {
                if (is_array($v) || is_object($v)) {
                    $data[$k] = $this->toArray($v, $dropApplication);
                }
            }

            return $data;
        }
}
