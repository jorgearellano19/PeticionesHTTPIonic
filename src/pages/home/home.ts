import { Component } from '@angular/core';
import { NavController, AlertController } from 'ionic-angular';

import { Http } from '@angular/http';
import { Storage } from '@ionic/storage';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
    saveInStorage: any;
  celulares: any; //Lista remota
  celularesStorage:any; //Lista local
  local:any;
  nombre: string;
  marca: string;
  timer: any;

  constructor(public navCtrl: NavController, public http:Http, public storage:Storage, public alert:AlertController, public alertCtrl: AlertController) {
    this.nombre ="";
    this.marca="";
  }

  ionViewDidEnter() {
      console.log('Cargó la página');
      this.storage.ready().then(()=>{ 
          this.storage.length().then((size)=>{ //Se verifica si hay algo en el local storage
              if(size>0){ //Si entra, hay datos previos
                  console.log("Hay datos previos");
                  this.storage.get('celulares').then((val)=>{ //Jala los datos del storage llamado celulares.
                      this.celulares = val; //Se obtienen en la variable celulares
                      console.log(this.celulares);
                      this.timer = setInterval(this.setCelular.bind(this, val), 1000); 
                      //Se trata de insertar con un setInterval, pasando como parámetro el valor y el tiempo.
                  });
              }else{
                  this.getCelulares(); //Si no hay datos previos, simplemente se ejecuta la función GET para traerlos de la BD
              }
          });
      });
  }

  public getCelulares():any { //Función GET para traer todo.
        this.http.get("http://arellanoastorga.esy.es/getcelulares.php") //Se hace la petición
        .subscribe(data => {
            this.celulares=data.json(); //Si es exitosa, se almacena en el JSON.
        }, error => { 
            return error.status; //SI no, se genera un error.
        });
   }

   public setCelular(val){ //Insertar en LocalStorage
        this.storage.ready().then(()=>{
          this.storage.length().then((tam)=>{ //Si el LocalStorage esta vacío, simplemente se limpia el intervalo
              if(tam == 0){
                  clearInterval(this.timer);
              }
          });
          for(let i =0; i<val.length;i++){
              //Se hace un ciclo con todos los elementos del Storage, haciendo post para cada uno
              this.http.post("http://arellanoastorga.esy.es/setcelulares.php", val[i])
              .subscribe(data => {
                  val.pop(); //SI el post es exitoso, se saca del arreglo.
                  this.storage.clear(); //Se limpia el storage
                  if(val.length != 0){
                      this.storage.set('celulares', val); //Si aún quedan valores en el arreglo, se almacenan otra vez para continuar el ciclo.
                  }
              }, error => {
                  console.log(JSON.stringify(error.json())); //SI hay error, se imprime en consola.
              });
          }
      });
    }

    public save(){ //Método que manda llamar el prompt para insertar
      let celular = { //Creamos un JSON con los datos a insertar
        nombre:this.nombre, 
        marca:this.marca,
      } 
      this.http.post("http://arellanoastorga.esy.es/setcelulares.php", celular) //Método post
      .subscribe(data => {
          this.getCelulares(); //Si fue exitoso, se recarga el get para poner el nuevo en pantalla.
      }, error => {
          this.storage.ready().then(() => {
              this.storage.length().then((size) =>{ //Si hay error, se almacena en storage
                  if(size>0){ //SI ya hay elementos en el storage, se hace push en el arreglo val
                      this.storage.get('celulares').then((val) =>{
                          val.push(celular);
                          this.celularesStorage = val; //A celularesStorage (lista local) se le asigna val
                          this.storage.set('celulares',val); //Asignamos storage celulares a val.
                      });
                  }else{
                      //No hay localstorage, almacena.
                      let valorLocal:any = []; //Se crea un objeto para poner ahí el dato
                      valorLocal.push(celular);
                      this.celularesStorage = valorLocal; //Lo ponemos en la lista celularesStorage
                      this.storage.set('celulares',valorLocal); //Se pone en storage
                  }
              });
          });
      })
    }

   /* public saveAndRetry(){
      this.storage.ready().then(()=> {
        this.storage.length().then((size)=>{
        if(size>0){
          console.log("fue mayor que cero");
          this.storage.get('celulares').then((val)=>{
            val.push(this.celulares);
            this.celulares = val;
            console.log("metiste el valor vatillo, a tu arreglo");
            this.storage.set('celulares', this.celulares);
            console.log(this.celulares);
            console.log("Intentaste guardar macho, ojalá sirva");
          });
        }else{
          let val = [];
          val.push()  
          this.storage.set('celulares', [this.celulares]);
          console.log(this.celulares);
          console.log("Intentaste guardar macho, ojalá sirva");
        }
        });
      }); 
    }*/

    public openAlertInput(){ //Alert al dar click
        let alert = this.alertCtrl.create({
            title: 'Añadir Celulares',
            inputs: [
                {
                    name: 'nombre',
                    placeholder: 'Nombre'
                },
                {
                    name: 'marca',
                    placeholder: 'marca'
                }
            ],
            buttons: [
                {
                    text: 'Cancel',
                    role: 'cancel',
                    handler: data => {
                        console.log('Cancel clicked');
                    }
                },
                {
                    text: 'Save',
                    handler: data => {
                        console.log(data);
                        this.nombre = data.nombre;
                        this.marca = data.marca;
                        this.save();
                        return true;
                    }
                }
            ]
        });
        alert.present();
        //this.save();
    }

   

}
