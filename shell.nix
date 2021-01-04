{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  nativeBuildInputs = with pkgs.python3Packages; [
    bottle
    cheroot
    jaraco_functools
    youtube-dl

    pkgs.nodePackages.web-ext
  ];
}
