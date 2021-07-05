<?php

namespace Job\Module;

use Basis\Toolkit;

class Bootstrap
{
    use Toolkit;

    public function run(): object
    {
        return $this->dispatch('module.configure');
    }
}
