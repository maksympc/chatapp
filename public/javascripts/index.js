localStorage.token = null;
$('form').on('submit', e => {
    e.preventDefault();
    let value = $(e.target).attr('class');
    let selector = '.' + value;
    $.ajax({
        url: '/' + value,
        type: 'POST',
        data: {
            username: $(selector + ' [name=username]').val(),
            email: $(selector + ' [name=email]').val(),
            password: $(selector + ' [name=password]').val()
        },
        beforeSend: () => {
            $(selector + ' button').prop('disabled', true);
        },
        success: (res) => {
            localStorage.token = res.token;
            // работает, перенаправляем на следю страницу
            window.location.replace(window.location.href + "chat");
        },
        error: (res) => {
            localStorage.token = '';
            $('#messageItem').text(res.responseJSON.message);
            $('#exampleModal').modal('show');
        },
        complete: () => {
            $(selector + ' button').prop('disabled', false);
        }
    });
    return false;
});