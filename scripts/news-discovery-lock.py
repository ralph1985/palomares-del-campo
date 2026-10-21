#!/usr/bin/env python3
"""Run the manual news worker under a private, symlink-safe file lock."""

from __future__ import annotations

import fcntl
import os
import stat
import subprocess
import sys
from pathlib import Path


def _check_owned_directory(directory: Path, uid: int) -> None:
    info = directory.lstat()
    if not stat.S_ISDIR(info.st_mode) or stat.S_ISLNK(info.st_mode) or info.st_uid != uid:
        raise RuntimeError("The news-worker lock directory is not a trusted user-owned directory.")
    if stat.S_IMODE(info.st_mode) & (stat.S_IWGRP | stat.S_IWOTH):
        raise RuntimeError("The news-worker lock directory is writable by other users.")


def _open_lock_file() -> int:
    nofollow = getattr(os, "O_NOFOLLOW", None)
    if nofollow is None:
        raise RuntimeError("This platform cannot safely open the news-worker lock without following symlinks.")

    uid = os.getuid()
    home = Path.home().resolve(strict=True)
    _check_owned_directory(home, uid)
    cache_directory = home / ".cache"
    cache_directory.mkdir(mode=0o700, exist_ok=True)
    _check_owned_directory(cache_directory, uid)

    lock_directory = cache_directory / "palomares-del-campo"
    lock_directory.mkdir(mode=0o700, exist_ok=True)
    _check_owned_directory(lock_directory, uid)
    os.chmod(lock_directory, 0o700)

    lock_path = lock_directory / "news-discovery.lock"
    flags = os.O_CREAT | os.O_RDWR | nofollow
    if hasattr(os, "O_CLOEXEC"):
        flags |= os.O_CLOEXEC
    descriptor = os.open(lock_path, flags, 0o600)
    info = os.fstat(descriptor)
    if not stat.S_ISREG(info.st_mode) or info.st_uid != uid or info.st_nlink != 1:
        os.close(descriptor)
        raise RuntimeError("The news-worker lock is not a private regular file.")
    os.fchmod(descriptor, 0o600)
    return descriptor


def main(command: list[str]) -> int:
    if not command:
        print("Missing news-worker command.", file=sys.stderr)
        return 2

    dry_run = "--dry-run" in command or os.environ.get("NEWS_DRY_RUN") == "1"
    if dry_run:
        return subprocess.run(command, check=False).returncode

    try:
        descriptor = _open_lock_file()
    except (OSError, RuntimeError) as error:
        print(f"News-worker lock unavailable: {error}", file=sys.stderr)
        return 1

    try:
        try:
            fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print("Ya hay una búsqueda de noticias en marcha; se omite esta ejecución.")
            return 0
        return subprocess.run(command, check=False).returncode
    finally:
        os.close(descriptor)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
