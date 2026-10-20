import os

import pytest

from calc import add, divide


def test_add():
    assert add(2, 3) == 5


def test_divide():
    assert divide(10, 2) == 5


def test_divide_by_zero():
    with pytest.raises(ValueError):
        divide(1, 0)


@pytest.mark.skipif(os.getenv("BREAK_TESTS") != "true", reason="set BREAK_TESTS=true to see an UNSTABLE build")
def test_broken():
    assert add(2, 2) == 5
