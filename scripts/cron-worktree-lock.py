#!/usr/bin/env python3
"""Run a scheduled job under the repository's private shared worktree lock."""

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
        raise RuntimeError("The cron lock directory is not a trusted user-owned directory.")
    if stat.S_IMODE(info.st_mode) & (stat.S_IWGRP | stat.S_IWOTH):
        raise RuntimeError("The cron lock directory is writable by other users.")


def _lock_path(create: bool) -> Path:
    uid = os.getuid()
    home = Path.home().resolve(strict=True)
    _check_owned_directory(home, uid)

    cache_directory = home / ".cache"
    if create:
        cache_directory.mkdir(mode=0o700, exist_ok=True)
    _check_owned_directory(cache_directory, uid)

    lock_directory = cache_directory / "palomares-del-campo"
    if create:
        lock_directory.mkdir(mode=0o700, exist_ok=True)
    _check_owned_directory(lock_directory, uid)
    if create:
        os.chmod(lock_directory, 0o700)
    return lock_directory / "cron-worktree.lock"


def _open_lock_file() -> int:
    nofollow = getattr(os, "O_NOFOLLOW", None)
    if nofollow is None:
        raise RuntimeError("This platform cannot safely open the shared cron lock without following symlinks.")

    lock_path = _lock_path(create=True)
    flags = os.O_CREAT | os.O_RDWR | nofollow
    if hasattr(os, "O_CLOEXEC"):
        flags |= os.O_CLOEXEC
    descriptor = os.open(lock_path, flags, 0o600)
    info = os.fstat(descriptor)
    if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_nlink != 1:
        os.close(descriptor)
        raise RuntimeError("The shared cron lock is not a private regular file.")
    os.fchmod(descriptor, 0o600)
    return descriptor


def _has_shared_lock_descriptor() -> bool:
    descriptor_text = os.environ.get("PALOMARES_CRON_LOCK_FD", "")
    if not descriptor_text.isdecimal():
        return False
    descriptor = int(descriptor_text)
    try:
        expected_path = _lock_path(create=False)
        expected = expected_path.lstat()
        actual = os.fstat(descriptor)
        if (
            not stat.S_ISREG(expected.st_mode)
            or stat.S_ISLNK(expected.st_mode)
            or expected.st_uid != os.getuid()
            or expected.st_nlink != 1
            or not stat.S_ISREG(actual.st_mode)
            or actual.st_uid != os.getuid()
            or actual.st_nlink != 1
            or (actual.st_dev, actual.st_ino) != (expected.st_dev, expected.st_ino)
        ):
            return False
        fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
        return True
    except (OSError, RuntimeError, ValueError):
        return False


def main(command: list[str]) -> int:
    if command == ["--check"]:
        return 0 if _has_shared_lock_descriptor() else 1
    if not command:
        print("Missing scheduled-job command.", file=sys.stderr)
        return 2

    try:
        descriptor = _open_lock_file()
    except (OSError, RuntimeError) as error:
        print(f"Shared cron lock unavailable: {error}", file=sys.stderr)
        return 1

    try:
        try:
            fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print("Ya hay una tarea de cron en marcha; se omite esta ejecución.")
            return 0
        child_environment = os.environ.copy()
        child_environment["PALOMARES_CRON_LOCK_FD"] = str(descriptor)
        return subprocess.run(
            command,
            check=False,
            env=child_environment,
            pass_fds=(descriptor,),
        ).returncode
    finally:
        os.close(descriptor)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
