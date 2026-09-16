from app.crud.crud_report import _report_version_label, _report_version_sort_key


def test_report_version_labels_use_original_and_numbers():
    assert _report_version_label("A", has_variant_set=True) == "Original"
    assert _report_version_label("B", has_variant_set=True) == "Version 1"
    assert _report_version_label("C", has_variant_set=True) == "Version 2"
    assert _report_version_label(None, has_variant_set=False) == "Original"


def test_report_version_labels_keep_unassigned_variant_participants_explicit():
    assert _report_version_label(None, has_variant_set=True) == "Unassigned"


def test_report_version_sort_puts_original_before_numbered_versions():
    codes = ["C", "A", "B"]

    assert sorted(codes, key=_report_version_sort_key) == ["A", "B", "C"]
