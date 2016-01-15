<?php

namespace NtechExtension\FosJsRoutingBundle;

use Symfony\Component\HttpKernel\Bundle\Bundle;

// Let's inherit this bundle from FOSJsRoutingBundle.
// Thus, we can override any method from any original bundle class.
// Info: http://symfony.com/doc/current/cookbook/bundles/inheritance.html
class NtechExtensionFosJsRoutingBundle extends Bundle
{
    public function getParent()
    {
        return 'FOSJsRoutingBundle';
    }
}