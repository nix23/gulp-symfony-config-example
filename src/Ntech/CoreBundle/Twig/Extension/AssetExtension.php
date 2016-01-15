<?php

namespace Ntech\CoreBundle\Twig\Extension;

// Asset extension usage in Twig:
//   Get css asset: <link href="{{ asset('client-core'|css) }}" type="text/css" rel="stylesheet"/>
//   Get js asset: <script src="{{ asset('client-core'|js) }}"></script>
class AssetExtension extends \Twig_Extension
{
    private $container;
    private $isDev;

    public function __construct($container)
    {
        $this->container = $container;
        $this->isDev = in_array(
            $this->container->get('kernel')->getEnvironment(), array('dev')
        );
    }

    private function getWebPath()
    {
        $path = $this->container->get('kernel')->getRootDir() . "/../web/";
        return $path;
    }

    public function getFilters()
    {
        // Let's register 2 filters - first for js files, second for css files.
        return array(
            new \Twig_SimpleFilter('css', array($this, 'getVersionedCss')),
            new \Twig_SimpleFilter('js', array($this, 'getVersionedJs'))
        );
    }

    public function getVersionedCss($filename)
    {
        // In dev mode we shouldn't rename our assets. (Otherwise browserSync will 
        // will perform full page reload instead of CSS injection)
        if($this->isDev)
            return "css/" . $filename . ".css";
        else
        // In production we should get our versioned file.
            return $this->getVersionedFile($filename . ".css", "css");
    }

    public function getVersionedJs($filename)
    {
        // Let's use same approach for js files. (Js files changes will trigger full page reload,
        // bet I think it will be more logical too use similar approach for dumping assets)
        if($this->isDev)
            return "js/" . $filename . ".js";
        else
            return $this->getVersionedFile($filename . ".js", "js");
    }

    // Reads manifest file and returns correct current dumped versioned file in production.
    // I'm storing manifest files right inside asset dirs(web/js/rev_manifest.json and 
    // web/css/rev_manifest.json). This files aren't containing any private information,
    // so I think it is correct place to store them.
    private function getVersionedFile($filename, $ext)
    {
        $manifestPath = $this->getWebPath() . $ext . "/rev-manifest.json";
        if(!file_exists($manifestPath))
            throw new \Exception("Cannot find manifest file: '{$manifestPath}'");

        $paths = json_decode(file_get_contents($manifestPath), true);
        if(!isset($paths[$filename]))
            throw new \Exception("File '{$filename}' not found in manifest!");

        return $ext . "/" . $paths[$filename];
    }

    public function getName()
    {
        return 'assetExtension';
    }
}