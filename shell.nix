{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  nativeBuildInputs = [
    pkgs.python3Packages.youtube-dl
    pkgs.nodePackages.web-ext
  ];
}
