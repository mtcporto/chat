class FileHandler {
  constructor() {
    this.setupListeners();
  }
  
  setupListeners() {
    const fileUploadBtn = document.getElementById('file-upload-btn');
    const fileUpload = document.getElementById('file-upload');
    
    if (fileUploadBtn && fileUpload) {
      fileUploadBtn.addEventListener('click', () => {
        fileUpload.click();
      });
      
      fileUpload.addEventListener('change', (e) => {
        this.handleFileSelection(e.target.files);
      });
    }
  }
  
  handleFileSelection(files) {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    console.log("Arquivo selecionado:", file.name, file.type, file.size);
    
    // Verificar tamanho máximo
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert("Arquivo muito grande. O tamanho máximo é 5MB.");
      return;
    }
    
    // Implementação real do upload vai aqui
    this.readFileAsBase64(file);
  }
  
  readFileAsBase64(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64data = e.target.result;
      console.log("Arquivo lido como Base64");
      
      // Aqui seria usado para enviar a mensagem
      // Ex: sendFileMessage(file.name, file.type, base64data);
    };
    
    reader.readAsDataURL(file);
  }
  
  downloadFile(base64data, filename, mimeType) {
    // Remover cabeçalho Data URL se existir
    const base64Content = base64data.includes('base64,') 
      ? base64data.split('base64,')[1]
      : base64data;
    
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    
    // Limpar
    URL.revokeObjectURL(link.href);
  }
}

export default new FileHandler();