const fileInput = document.getElementById('fileInput');
const dropzone = document.getElementById('dropzone');
const preview = document.getElementById('preview');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const noImageText = document.getElementById('noImageText');
const messageArea = document.getElementById('messageArea');
const statusText = document.getElementById('statusText');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const formatSelect = document.getElementById('formatSelect');
const convertBtn = document.getElementById('convertBtn');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const maintainAspectRatio = document.getElementById('maintainAspectRatio');
const resizeBtn = document.getElementById('resizeBtn');
const resizeDownloadBtn = document.getElementById('resizeDownloadBtn');
const resizeResetBtn = document.getElementById('resizeResetBtn');
const cropOverlay = document.getElementById('cropOverlay');
const cropWidthInput = document.getElementById('cropWidthInput');
const cropHeightInput = document.getElementById('cropHeightInput');
const cropBtn = document.getElementById('cropBtn');
const cropDownloadBtn = document.getElementById('cropDownloadBtn');
const resetCropBtn = document.getElementById('resetCropBtn');
const brightnessSlider = document.getElementById('brightnessSlider');
const brightnessValue = document.getElementById('brightnessValue');
const contrastSlider = document.getElementById('contrastSlider');
const contrastValue = document.getElementById('contrastValue');
const saturationSlider = document.getElementById('saturationSlider');
const saturationValue = document.getElementById('saturationValue');
const filterOptions = document.querySelectorAll('.filter-option');
const applyFilterBtn = document.getElementById('applyFilterBtn');
const filterDownloadBtn = document.getElementById('filterDownloadBtn');
const resetFilterBtn = document.getElementById('resetFilterBtn');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const compressionType = document.getElementById('compressionType');
const compressBtn = document.getElementById('compressBtn');

let image = new Image();
let originalImage = new Image();
let currentFilter = 'normal';
let aspectRatio = 1;
let cropStartX, cropStartY, isCropping = false;
let imageEdited = false;

let cropX = 0;
let cropY = 0;
let cropWidth = 0;
let cropHeight = 0;

const filters = {
    normal: { brightness: 100, contrast: 100, saturation: 100 },
    grayscale: { brightness: 100, contrast: 100, saturation: 0 },
    sepia: { brightness: 110, contrast: 110, saturation: 40, sepia: true },
    vintage: { brightness: 120, contrast: 90, saturation: 85, sepia: true }
};

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        if (tab.dataset.tab !== 'upload' && !image.src) {
            showMessage('Carregue uma imagem primeiro!', 'warning');
            return;
        }

        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');

        if (tab.dataset.tab === 'crop' && image.src) {
            cropOverlay.style.display = 'block';
            updateCropOverlay();
        } else {
            cropOverlay.style.display = 'none';
        }

        updateStatus(tab.dataset.tab);
    });
});

function updateStatus(currentTab) {
    if (!image.src) {
        statusText.textContent = 'Carregue uma imagem para começar';
        return;
    }

    const tabMessages = {
        upload: 'Imagem carregada com sucesso',
        converter: 'Selecione o formato de saída e clique em converter',
        resize: 'Ajuste as dimensões e clique em aplicar',
        crop: 'Selecione a área de recorte na imagem',
        filters: 'Aplique os filtros desejados na imagem',
        compress: 'Ajuste a qualidade e o formato de compressão'
    };

    statusText.textContent = tabMessages[currentTab] || 'Pronto para editar';
}

function showMessage(text, type = 'success') {
    messageArea.textContent = text;
    messageArea.className = `message ${type}`;
    messageArea.style.display = 'block';

    setTimeout(() => {
        messageArea.style.display = 'none';
    }, 5000);
}

function loadImage(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        originalImage.onload = function () {
            image = new Image();
            image.src = originalImage.src;
            image.onload = function () {
                canvas.width = image.width;
                canvas.height = image.height;

                preview.src = image.src;
                preview.style.display = 'block';
                noImageText.style.display = 'none';

                widthInput.value = image.width;
                heightInput.value = image.height;
                aspectRatio = image.width / image.height;

                cropWidth = Math.min(300, image.width);
                cropHeight = Math.min(300, image.height);
                cropX = (image.width - cropWidth) / 2;
                cropY = (image.height - cropHeight) / 2;
                cropWidthInput.value = cropWidth;
                cropHeightInput.value = cropHeight;
                updateCropOverlay();

                loadFilterPreviews();

                drawImage();

                showMessage('Imagem carregada com sucesso!');

                const converterTab = document.querySelector('[data-tab="converter"]');
                converterTab.click();

                imageEdited = false;
            };
        };
        originalImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, unhighlight, false);
});

function highlight() {
    dropzone.classList.add('highlight');
}

function unhighlight() {
    dropzone.classList.remove('highlight');
}

dropzone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0 && files[0].type.startsWith('image/')) {
        fileInput.files = files;
        loadImage(files[0]);
    }
}

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) loadImage(file);
});

function downloadImage(format = 'image/png', quality = 1.0, filename = 'imagem_editada') {
    const extension = format.split('/')[1];
    const dataURL = canvas.toDataURL(format, quality);

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `${filename}.${extension}`;
    link.click();

    showMessage(`Imagem baixada com sucesso no formato ${extension.toUpperCase()}`);
}

widthInput.addEventListener('input', () => {
    if (maintainAspectRatio.checked && widthInput.value) {
        heightInput.value = Math.round(widthInput.value / aspectRatio);
    }
});

heightInput.addEventListener('input', () => {
    if (maintainAspectRatio.checked && heightInput.value) {
        widthInput.value = Math.round(heightInput.value * aspectRatio);
    }
});

resizeBtn.addEventListener('click', () => {
    if (!image.src) return;

    const newWidth = parseInt(widthInput.value) || image.width;
    const newHeight = parseInt(heightInput.value) || image.height;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;

    tempCtx.drawImage(image, 0, 0, newWidth, newHeight);

    image = new Image();
    image.onload = function () {
        canvas.width = newWidth;
        canvas.height = newHeight;
        drawImage();
        preview.src = image.src;
        showMessage('Imagem redimensionada com sucesso!');
        imageEdited = true;
    };
    image.src = tempCanvas.toDataURL('image/png');
});

resizeDownloadBtn.addEventListener('click', () => {
    if (!image.src) return;
    downloadImage('image/png', 1.0, 'imagem_redimensionada');
});

resizeResetBtn.addEventListener('click', () => {
    if (!originalImage.src) return;

    image = new Image();
    image.onload = function () {
        canvas.width = image.width;
        canvas.height = image.height;
        aspectRatio = image.width / image.height;
        widthInput.value = image.width;
        heightInput.value = image.height;
        drawImage();
        preview.src = image.src;
        showMessage('Redimensionamento resetado!');
        imageEdited = false;
    };
    image.src = originalImage.src;
});

preview.addEventListener('mousedown', startCrop);
document.addEventListener('mousemove', updateCrop);
document.addEventListener('mouseup', endCrop);

function startCrop(e) {
    if (!image.src || !document.getElementById('tab-crop').classList.contains('active')) return;

    const rect = preview.getBoundingClientRect();
    const scaleX = image.width / preview.offsetWidth;
    const scaleY = image.height / preview.offsetHeight;

    cropStartX = (e.clientX - rect.left) * scaleX;
    cropStartY = (e.clientY - rect.top) * scaleY;

    isCropping = true;
}

function updateCrop(e) {
    if (!isCropping || !image.src) return;

    const rect = preview.getBoundingClientRect();
    const scaleX = image.width / preview.offsetWidth;
    const scaleY = image.height / preview.offsetHeight;

    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    cropX = Math.min(cropStartX, currentX);
    cropY = Math.min(cropStartY, currentY);
    cropWidth = Math.abs(currentX - cropStartX);
    cropHeight = Math.abs(currentY - cropStartY);

    cropWidthInput.value = Math.round(cropWidth);
    cropHeightInput.value = Math.round(cropHeight);

    updateCropOverlay();
}

function endCrop() {
    isCropping = false;
}

function updateCropOverlay() {
    if (!image.src) return;

    const previewRect = preview.getBoundingClientRect();
    const scaleX = preview.offsetWidth / image.width;
    const scaleY = preview.offsetHeight / image.height;
    cropOverlay.style.left = `${cropX * scaleX}px`;
    cropOverlay.style.top = `${cropY * scaleY}px`;
    cropOverlay.style.width = `${cropWidth * scaleX}px`;
    cropOverlay.style.height = `${cropHeight * scaleY}px`;

    if (document.getElementById('tab-crop').classList.contains('active')) {
        cropOverlay.style.display = 'block';
    } else {
        cropOverlay.style.display = 'none';
    }
}


cropWidthInput.addEventListener('input', () => {
    if (image.src) {
        cropWidth = parseInt(cropWidthInput.value) || cropWidth;
        updateCropOverlay();
    }
});

cropHeightInput.addEventListener('input', () => {
    if (image.src) {
        cropHeight = parseInt(cropHeightInput.value) || cropHeight;
        updateCropOverlay();
    }
});

cropBtn.addEventListener('click', () => {
    if (!image.src || cropWidth < 1 || cropHeight < 1) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    tempCtx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    image = new Image();
    image.onload = function () {
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        aspectRatio = cropWidth / cropHeight;
        drawImage();
        preview.src = image.src;

        cropX = 0;
        cropY = 0;
        cropWidth = image.width;
        cropHeight = image.height;
        cropWidthInput.value = cropWidth;
        cropHeightInput.value = cropHeight;
        updateCropOverlay();
    };
    image.src = tempCanvas.toDataURL('image/png');
});

resetCropBtn.addEventListener('click', () => {
    if (!image.src) return;

    cropX = 0;
    cropY = 0;
    cropWidth = image.width;
    cropHeight = image.height;
    cropWidthInput.value = cropWidth;
    cropHeightInput.value = cropHeight;
    updateCropOverlay();
});

cropDownloadBtn.addEventListener('click', () => {
    if (!image.src) return;
    downloadImage('image/png', 1.0, 'imagem_recortada');
});

brightnessSlider.addEventListener('input', updateFilterValues);
contrastSlider.addEventListener('input', updateFilterValues);
saturationSlider.addEventListener('input', updateFilterValues);

function updateFilterValues() {
    brightnessValue.textContent = `${brightnessSlider.value}%`;
    contrastValue.textContent = `${contrastSlider.value}%`;
    saturationValue.textContent = `${saturationSlider.value}%`;

    filterOptions.forEach(option => {
        option.classList.remove('selected');
    });
    currentFilter = 'custom';
}

function loadFilterPreviews() {
    if (!image.src) return;

    filterOptions.forEach(option => {
        const filterName = option.dataset.filter;
        const filterPreview = option.querySelector('.filter-preview');

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = 100;
        tempCanvas.height = 100;

        tempCtx.drawImage(image, 0, 0, image.width, image.height, 0, 0, 100, 100);

        applyFilterToCanvas(tempCtx, tempCanvas.width, tempCanvas.height, filters[filterName]);

        filterPreview.style.backgroundImage = `url(${tempCanvas.toDataURL()})`;
        filterPreview.style.backgroundSize = 'cover';
        filterPreview.style.backgroundPosition = 'center';
    });
}

filterOptions.forEach(option => {
    option.addEventListener('click', () => {
        filterOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        const filterName = option.dataset.filter;
        currentFilter = filterName;

        const filter = filters[filterName];
        brightnessSlider.value = filter.brightness;
        contrastSlider.value = filter.contrast;
        saturationSlider.value = filter.saturation;

        brightnessValue.textContent = `${filter.brightness}%`;
        contrastValue.textContent = `${filter.contrast}%`;
        saturationValue.textContent = `${filter.saturation}%`;
    });
});

applyFilterBtn.addEventListener('click', () => {
    if (!image.src) return;

    const filterSettings = {
        brightness: parseInt(brightnessSlider.value),
        contrast: parseInt(contrastSlider.value),
        saturation: parseInt(saturationSlider.value),
        sepia: currentFilter === 'sepia' || currentFilter === 'vintage'
    };

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;

    tempCtx.drawImage(image, 0, 0);
    applyFilterToCanvas(tempCtx, tempCanvas.width, tempCanvas.height, filterSettings);

    image = new Image();
    image.onload = function () {
        drawImage();
        preview.src = image.src;
    };
    image.src = tempCanvas.toDataURL('image/png');
});

resetFilterBtn.addEventListener('click', () => {
    if (!originalImage.src) return;

    image = new Image();
    image.onload = function () {
        canvas.width = image.width;
        canvas.height = image.height;
        drawImage();
        preview.src = image.src;

        brightnessSlider.value = 100;
        contrastSlider.value = 100;
        saturationSlider.value = 100;
        brightnessValue.textContent = '100%';
        contrastValue.textContent = '100%';
        saturationValue.textContent = '100%';

        filterOptions.forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector('[data-filter="normal"]').classList.add('selected');
        currentFilter = 'normal';
    };
    image.src = originalImage.src;
});

filterDownloadBtn.addEventListener('click', () => {
    if (!image.src) return;
    downloadImage('image/png', 1.0, 'imagem_com_filtro');
});


function applyFilterToCanvas(context, width, height, filterSettings) {
    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;

    const brightness = filterSettings.brightness / 100;
    const contrast = filterSettings.contrast / 100;
    const saturation = filterSettings.saturation / 100;
    const sepia = filterSettings.sepia || false;

    for (let i = 0; i < data.length; i += 4) {
        data[i] = data[i] * brightness;
        data[i + 1] = data[i + 1] * brightness;
        data[i + 2] = data[i + 2] * brightness;

        data[i] = ((data[i] - 128) * contrast) + 128;
        data[i + 1] = ((data[i + 1] - 128) * contrast) + 128;
        data[i + 2] = ((data[i + 2] - 128) * contrast) + 128;

        if (sepia) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }

        if (saturation !== 1) {
            const gray = 0.2989 * data[i] + 0.5870 * data[i + 1] + 0.1140 * data[i + 2];

            data[i] = Math.min(255, Math.max(0, gray + (data[i] - gray) * saturation));
            data[i + 1] = Math.min(255, Math.max(0, gray + (data[i + 1] - gray) * saturation));
            data[i + 2] = Math.min(255, Math.max(0, gray + (data[i + 2] - gray) * saturation));
        }
    }

    context.putImageData(imageData, 0, 0);
}


qualitySlider.addEventListener('input', () => {
    qualityValue.textContent = `${qualitySlider.value}%`;
});

compressBtn.addEventListener('click', () => {
    if (!image.src) return;

    const quality = parseInt(qualitySlider.value) / 100;
    const format = compressionType.value;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = image.width;
    tempCanvas.height = image.height;

    tempCtx.drawImage(image, 0, 0);

    const dataURL = tempCanvas.toDataURL(format, quality);

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `imagem_comprimida.${format.split('/')[1]}`;
    link.click();
});

convertBtn.addEventListener('click', () => {
    if (!image.src) return;

    const format = formatSelect.value;

    const quality = format === 'image/png' ? 1.0 : 0.9;

    const dataURL = canvas.toDataURL(format, quality);

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `imagem_convertida.${format.split('/')[1]}`;
    link.click();
});

function drawImage() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        if (tab.dataset.tab === 'crop' && image.src) {
            cropOverlay.style.display = 'block';
        } else {
            cropOverlay.style.display = 'none';
        }
    });
});

window.addEventListener('resize', () => {
    if (image.src) {
        updateCropOverlay();
    }
});