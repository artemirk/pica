////////////////////////////////////////////////////////////////////////////////
// performance.now polyfill
(function() {
if(window.performance && window.performance.now) return;
if(!window.performance) window.performance = {};
var methods = ['webkitNow', 'msNow', 'mozNow'];
for(var i = 0; i < methods.length; i++) {
  if(window.performance[methods[i]]) {
    window.performance.now = window.performance[methods[i]];
    return;
  }
}
if(Date.now) {
  window.performance.now = function() { return Date.now(); };
  return;
}
window.performance.now = function() { return +(new Date()); };
})();

////////////////////////////////////////////////////////////////////////////////

var qualityInfo = [
  'Box (win 0.5px)',
  'Hamming (win 1px)',
  'Lanczos (win 2px)',
  'Lanczos (win 3px)',
]

function updateOrig() {
  var src, ctx;

  src = $('#src')[0];
  src.width = img.width;
  src.height = img.height;

  $('#src-info').text(_.template('<%= w %> x <%= h %>', {
    w: img.width,
    h: img.height
  }));

  ctx = src.getContext("2d");
  ctx.drawImage(img, 0, 0);
}

var updateResized = _.debounce(function () {
  var dst, ctx, width, start, time;

  width = $('.pica-options').width();

  // Resize with canvas

  dst = $('#dst-cvs')[0];
  dst.width = width;
  dst.height = img.height * width / img.width;

  start = performance.now();

  ctx = dst.getContext("2d")
  ctx.drawImage(img, 0, 0, dst.width, dst.height);
  time = (performance.now() - start).toFixed(2);

  $('#dst-cvs-info').text(_.template('<%= time %>ms, <%= w %> x <%= h %>', {
    time: time,
    w: dst.width,
    h: dst.height
  }));

  // Resize with pica

  dst = $('#dst-pica')[0];
  dst.width = width;
  dst.height = img.height * width / img.width;

  start = performance.now();

  window.pica.resizeCanvas($('#src')[0], dst, {
    quality: quality,
    unsharpAmount: unsharpAmount,
    unsharpThreshold: unsharpThreshold,
    blurKernelRadius: isNaN(blurKernelRadius) ? 1.0 : blurKernelRadius,
    blurAlgorithm: blurAlgorithm | 0,
    transferable: true
  }, function (err) {
    time = (performance.now() - start).toFixed(2);
    if (unsharpAmount) {
      $('#dst-info').text(_.template('<%= time %>ms, <%= info %>, Unsharp [<%= amount %>, 1.0, <%= threshold %>]', {
        time: time,
        info: qualityInfo[quality],
        amount: unsharpAmount,
        threshold: unsharpThreshold
      }));
    } else {
      $('#dst-info').text(_.template('<%= time %>ms, <%= info %>, Unsharp off', {
        time: time,
        info: qualityInfo[quality]
      }));
    }
  });
}, 100);

//
// Init
//
var img = new Image();
var quality = Number($('#pica-quality').val());
$('#pica-quality').closest('.pica-options').find('span#value').text(($('#pica-quality').val()));
var unsharpAmount = Number($('#pica-unsharp-amount').val());
$('#pica-unsharp-amount').closest('.pica-options').find('span#value').text(($('#pica-unsharp-amount').val()));
var unsharpThreshold = Number($('#pica-unsharp-threshold').val());
$('#pica-unsharp-threshold').closest('.pica-options').find('span#value').text(($('#pica-unsharp-threshold').val()));
var blurAlgorithm = $('input[name=pica-blur-algorithm]:checked').val();
if (blurAlgorithm == 0) $('#pica-blur-kernel-radius').val(1.0);
$('#pica-blur-kernel-radius').prop('disabled', blurAlgorithm == 0);
var blurKernelRadius = parseFloat($('#pica-blur-kernel-radius').val());
$('#pica-blur-kernel-radius').closest('.pica-options').find('span#value').text(($('#pica-blur-kernel-radius').val()));

img.src = imageEncoded;

img.onload = function () {
  updateOrig();
  updateResized();
};

$(window).on('resize', updateResized);
$('#dst-pica').on('click', updateResized);
$('#dst-cvs').on('click', updateResized);


$('#pica-quality').on('change', function () {
  quality = Number($('#pica-quality').val());
  updateResized();
});
$('#pica-unsharp-amount').on('change', function () {
  unsharpAmount = Number($('#pica-unsharp-amount').val());
  updateResized();
});
$('#pica-unsharp-threshold').on('change', function () {
  unsharpThreshold = Number($('#pica-unsharp-threshold').val());
  updateResized();
});
$('#pica-blur-kernel-radius').on('change', function () {
  blurKernelRadius = parseFloat($('#pica-blur-kernel-radius').val());
  updateResized();
});
$('input[name=pica-blur-algorithm]').on('change', function () {
  blurAlgorithm = $('input[name=pica-blur-algorithm]:checked').val();
  if (blurAlgorithm == 0) {
    $el = $('#pica-blur-kernel-radius');
    $el.val(1.0);
    $el.closest('.pica-options').find('span#value').text($el.val());
  }
  $('#pica-blur-kernel-radius').prop('disabled', blurAlgorithm == 0);
  updateResized();
});

$('#pica-quality, #pica-unsharp-amount, #pica-unsharp-threshold, #pica-blur-kernel-radius').on('input change', function () {
  var $this = $(this);
  $this.closest('.pica-options').find('span#value').text($this.val());
});


$('#upload-btn, #src').on('click', function () {
  $('#upload').trigger('click');
});

$('#upload').on('change', function () {
  var files = $(this)[0].files;

  if (files.length === 0) { return; }

  img.src = window.URL.createObjectURL(files[0]);
});
