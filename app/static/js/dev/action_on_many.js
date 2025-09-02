$(document).ready(function() {
  $('#hotels__table-body').on('change', ".select__checkbox", function() {
    const total = $(".select__checkbox:checked").length;
    const $currentCheckbox = $(this);

    if (total > 0) {
      $(".action__button-child").css("display", "flex");
    } else {
      $(".action__button-child").hide();
    }
  });
});
