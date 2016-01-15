<?php
namespace NtechExtension\FosJsRoutingBundle\Command;

use FOS\JsRoutingBundle\Command\DumpCommand as BaseDumpCommand;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class DumpCommand extends BaseDumpCommand
{
    // Relative to web/
    const DUMP_TARGET_PATH = "bundles/fosjsrouting/js/routes.js";

    // fos:js-routing:dump command will dump file with routes inside web/js/fos_js_router.js
    // file by default. On production we want to use cache busting for this file, so we need
    // to dump somewhere else this file by default and then build it through our rev() Gulp
    // plugin.(On production)

    // Unfortunately, dump command don't have configuration option for setting target_path.
    // You can pass --target option inside console args only when you are executing console command.
    // Because this is not very convenient, let's override initialize method.
    // Basically it just sets target in InputInterface object, so parent command will threat it
    // like an argument received from console.

    // Please remember, that --target option from console will not work with such approach.
    // (It will be always overriden by this function) Looks like a small hack, but for me is seems much
    // more logical than creating command with another name, which will just call original dump command
    // with correct --target arg.
    protected function initialize(InputInterface $input, OutputInterface $output)
    {
        $webPath = sprintf('%s/../web/', $this->getContainer()->getParameter('kernel.root_dir'));
        $targetPath = $webPath . self::DUMP_TARGET_PATH;

        $input->setOption("target", $targetPath);
        parent::initialize($input, $output);
    }
}